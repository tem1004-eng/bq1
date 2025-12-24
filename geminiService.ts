
import { GoogleGenAI, Type } from "@google/genai";
import { QuizData, QuizItem } from "./types";
import { BIBLE_BOOKS, BIBLE_CHARACTERS } from "./constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const getInitials = (word: string): string => {
  const CHOSUNG = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
  ];
  let result = "";
  for (let i = 0; i < word.length; i++) {
    const code = word.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) {
      result += CHOSUNG[Math.floor(code / 588)];
    } else {
      result += word.charAt(i);
    }
  }
  return result;
};

export const generateQuizData = async (subject: string, count: number, category: string): Promise<QuizData> => {
  let categoryPrompt = "";
  
  if (category === 'bible') {
    categoryPrompt = `성경 "${subject}" 권의 내용만으로 구성된 초성 퀴즈 ${count}문제를 만들어주세요. 반드시 해당 권에 등장하는 인물, 지명, 핵심 단어만 사용하세요.`;
  } else if (category === 'character') {
    categoryPrompt = `성경 인물 "${subject}"의 생애와 관련된 초성 퀴즈 ${count}문제를 만들어주세요. 인물에 대한 성경적 사건과 배경을 포함하세요.`;
  } else {
    categoryPrompt = `"${subject}" 주제와 관련된 성경 전체의 내용을 바탕으로 초성 퀴즈 ${count}문제를 만들어주세요.`;
  }

  const finalPrompt = `
    ${categoryPrompt}
    
    필수 요구사항:
    1. 단어(word)는 2~5글자 사이의 성경 용어여야 합니다.
    2. 설명(clue)은 해당 단어를 성경적으로 설명하며, 독자가 정답을 유추할 수 있도록 구체적이어야 합니다.
    3. 정확히 ${count}개의 문제를 생성하세요.
    4. 응답은 반드시 지정된 JSON 형식을 지켜야 합니다.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: finalPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              minItems: count,
              maxItems: count,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  clue: { type: Type.STRING },
                },
                required: ["word", "clue"],
              },
            },
          },
          required: ["items"],
        },
      },
    });

    const rawData = JSON.parse(response.text);
    const items: QuizItem[] = rawData.items.map((item: any) => ({
      ...item,
      initials: getInitials(item.word)
    }));

    return { items };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("성경 퀴즈 데이터를 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
  }
};
