import { GoogleGenAI, Type } from '@google/genai';
import { Question, CognitiveLevel, KbcValue, ProfilLulusan } from '../src/types';

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface AiGenerateParams {
  subject: string;
  grade: 'VII' | 'VIII' | 'IX';
  topic: string;
  subtopic?: string;
  learningObjective?: string;
  count: number;
  difficulty?: 'Mudah' | 'Sedang' | 'Sulit';
  cognitiveLevel?: CognitiveLevel;
  kbcValue?: KbcValue;
  profilLulusan?: ProfilLulusan;
  materialText?: string; // For "Materi -> Kuis"
  modeType?: string;
  isRemedial?: boolean;
  isEnrichment?: boolean;
}

export async function generateQuizQuestionsWithAi(
  params: AiGenerateParams,
  teacherId: string
): Promise<Question[]> {
  const ai = getAiClient();
  const count = Math.max(1, Math.min(params.count || 5, 20));

  if (!ai) {
    // Graceful pedagogical fallback when API key is not configured yet
    return generateFallbackQuestions(params, count, teacherId);
  }

  try {
    const promptContext = `
Anda adalah konsultan ahli kurikulum madrasah dan pembuat butir soal asesmen edukatif untuk MTsN 5 Tegal.
Tugas: Buat ${count} butir soal berkualitas tinggi dengan spesifikasi berikut:
- Jenjang: Madrasah Tsanawiyah (MTs) Kelas ${params.grade}
- Mata Pelajaran: ${params.subject}
- Materi Pokok: ${params.topic}
${params.subtopic ? `- Submateri: ${params.subtopic}` : ''}
${params.learningObjective ? `- Tujuan Pembelajaran: ${params.learningObjective}` : ''}
- Tingkat Kesulitan: ${params.difficulty || 'Sedang'}
- Level Kognitif Bloom Revisi: ${params.cognitiveLevel || 'C3'}
${params.kbcValue ? `- Kurikulum Berbasis Cinta (KBC): ${params.kbcValue}` : ''}
${params.profilLulusan ? `- Dimensi Profil Lulusan: ${params.profilLulusan}` : ''}
${params.isRemedial ? '- Konteks Khusus: Soal Remedial (soal sederhana, menguatkan konsep dasar).' : ''}
${params.isEnrichment ? '- Konteks Khusus: Soal Pengayaan (soal menantang, analisis kritis).' : ''}
${params.materialText ? `\nSumber Teks Materi Yang Diberikan Guru:\n"""${params.materialText}"""\n` : ''}

Ketentuan Khusus Jawaban:
1. "answer" (jawaban) harus berupa 1 kata atau frasa singkat (2-14 karakter alfabet) yang cocok jika dijadikan Teka-Teki Silang (TTS), Word Search, ataupun kunci pilihan ganda.
2. Sediakan 4 opsi pilihan ganda ("options") di mana salah satunya persis sama dengan "answer".
3. "hint" harus memberikan petunjuk yang mendidik tanpa langsung membocorkan jawaban.
4. "explanation" memuat pembahasan komprehensif beretika madrasah.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptContext,
      config: {
        systemInstruction:
          'Anda adalah Educational Assessment Specialist untuk madrasah dengan nilai-nilai luhur islami, pedagogik modern, dan Kurikulum Berbasis Cinta (KBC).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'Teks pertanyaan/soal' },
              answer: { type: Type.STRING, description: 'Kunci jawaban singkat 1 kata/frasa kapital' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '4 opsi jawaban pilihan ganda'
              },
              explanation: { type: Type.STRING, description: 'Pembahasan ringkas' },
              hint: { type: Type.STRING, description: 'Petunjuk/clue pengerjaan' },
              cognitiveLevel: {
                type: Type.STRING,
                description: 'Level kognitif: C1, C2, C3, C4, C5, atau C6'
              },
              difficulty: {
                type: Type.STRING,
                description: 'Mudah, Sedang, atau Sulit'
              },
              indicator: { type: Type.STRING, description: 'Indikator ketercapaian soal' }
            },
            required: ['question', 'answer', 'options', 'explanation', 'hint', 'cognitiveLevel', 'difficulty']
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((item, idx) => ({
        id: `q_ai_${Date.now()}_${idx + 1}`,
        question: item.question,
        answer: (item.answer || '').toUpperCase().trim(),
        options: Array.isArray(item.options) && item.options.length === 4 ? item.options : [item.answer, 'PILIHAN B', 'PILIHAN C', 'PILIHAN D'],
        explanation: item.explanation,
        hint: item.hint,
        subject: params.subject,
        grade: params.grade,
        phase: 'D',
        topic: params.topic,
        subtopic: params.subtopic,
        learningObjective: params.learningObjective,
        indicator: item.indicator || 'Peserta didik dapat menganalisis konsep dengan tepat',
        cognitiveLevel: (['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].includes(item.cognitiveLevel) ? item.cognitiveLevel : (params.cognitiveLevel || 'C3')) as CognitiveLevel,
        difficulty: (['Mudah', 'Sedang', 'Sulit'].includes(item.difficulty) ? item.difficulty : (params.difficulty || 'Sedang')) as 'Mudah' | 'Sedang' | 'Sulit',
        profilLulusan: params.profilLulusan ? [params.profilLulusan] : ['Penalaran kritis'],
        kbcValue: params.kbcValue ? [params.kbcValue] : ['Cinta Ilmu'],
        createdBy: teacherId,
        createdAt: new Date().toISOString(),
        status: 'DRAFT' // Strictly DRAFT as required by prompt Section H & BW!
      }));
    }
  } catch (err) {
    console.error('Gemini API call failed, using fallback template generator:', err);
  }

  return generateFallbackQuestions(params, count, teacherId);
}

function generateFallbackQuestions(
  params: AiGenerateParams,
  count: number,
  teacherId: string
): Question[] {
  const fallbackBank: { q: string; a: string; opts: string[]; exp: string; hint: string; cog: CognitiveLevel; diff: 'Mudah' | 'Sedang' | 'Sulit' }[] = [
    {
      q: `Kegiatan terencana dalam ${params.topic} yang bertujuan meningkatkan efisiensi dan kemaslahatan bersama disebut...`,
      a: 'INOVASI',
      opts: ['INOVASI', 'STAGNASI', 'MONOPOLI', 'IMITASI'],
      exp: 'Inovasi merupakan penemuan atau pengembangan gagasan baru yang membawa dampak positif pada masyarakat.',
      hint: 'Pembaruan gagasan kreatif untuk menghasilkan solusi terbaik.',
      cog: 'C2',
      diff: 'Sedang'
    },
    {
      q: `Prinsip keadilan dan keterbukaan dalam transaksi ${params.topic} sesuai nilai-nilai madrasah adalah...`,
      a: 'AMANAH',
      opts: ['AMANAH', 'CURANG', 'BOROS', 'RIYA'],
      exp: 'Sifat amanah menjamin kepercayaan antara pelaku usaha dan konsumen senantiasa terjaga.',
      hint: 'Dapat dipercaya dan memegang teguh komitmen moral.',
      cog: 'C3',
      diff: 'Mudah'
    },
    {
      q: `Kemampuan memilih dan mengevaluasi informasi secara objektif dalam konteks ${params.topic} mencerminkan sikap...`,
      a: 'KRITIS',
      opts: ['KRITIS', 'PASIF', 'APATIS', 'LATAH'],
      exp: 'Berpikir kritis menghindarkan peserta didik dari informasi hoaks dan penipuan digital.',
      hint: 'Tidak mudah percaya tanpa bukti dan analisis mendalam.',
      cog: 'C4',
      diff: 'Sedang'
    },
    {
      q: `Wadah musyawarah dan kerja sama gotong royong ekonomi yang berlandaskan asas kekeluargaan di Indonesia adalah...`,
      a: 'KOPERASI',
      opts: ['KOPERASI', 'KARTEL', 'OLIGOPOLI', 'KONGSI'],
      exp: 'Koperasi sesuai dengan amanat UUD 1945 pasal 33 mengedepankan kesejahteraan bersama.',
      hint: 'Didirikan oleh anggota untuk anggota, lambang pohon beringin / teratai.',
      cog: 'C2',
      diff: 'Mudah'
    },
    {
      q: `Dampak positif pemanfaatan teknologi digital pada pembelajaran ${params.topic} adalah mempercepat...`,
      a: 'AKSES',
      opts: ['AKSES', 'KENDALA', 'BIAYA', 'JARAK'],
      exp: 'Akses informasi yang cepat mempermudah eksplorasi ilmu pengetahuan secara inklusif.',
      hint: 'Kemudahan menjangkau materi dan sumber belajar.',
      cog: 'C1',
      diff: 'Mudah'
    }
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = fallbackBank[i % fallbackBank.length];
    return {
      id: `q_ai_fallback_${Date.now()}_${i + 1}`,
      question: template.q,
      answer: template.a,
      options: template.opts,
      explanation: template.exp,
      hint: template.hint,
      subject: params.subject,
      grade: params.grade,
      phase: 'D',
      topic: params.topic,
      subtopic: params.subtopic || 'Pendalaman Materi',
      learningObjective: params.learningObjective || `Memahami prinsip dasar ${params.topic}`,
      indicator: `Peserta didik mampu memahami konsep ${template.a.toLowerCase()}`,
      cognitiveLevel: params.cognitiveLevel || template.cog,
      difficulty: params.difficulty || template.diff,
      profilLulusan: params.profilLulusan ? [params.profilLulusan] : ['Penalaran kritis'],
      kbcValue: params.kbcValue ? [params.kbcValue] : ['Cinta Ilmu'],
      createdBy: teacherId,
      createdAt: new Date().toISOString(),
      status: 'DRAFT'
    };
  });
}
