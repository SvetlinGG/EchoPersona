export interface EmotionVector {
    arousal: number;
    valence: number;
    label?: 'calm' | 'stressed' | 'sad' | 'happy' | 'neutral';
    
}