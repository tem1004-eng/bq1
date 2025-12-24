
export interface QuizItem {
  word: string;
  clue: string;
  initials: string;
}

export interface QuizData {
  items: QuizItem[];
}

export interface UserAnswer {
  index: number;
  answer: string;
  isCorrect?: boolean;
}
