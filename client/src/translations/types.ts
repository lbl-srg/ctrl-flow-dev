import { LocalizedStringsMethods } from "react-localization";

export interface OnboardingSlide {
  title: string;
  copy: string;
  points: string[];
}

export interface Translations extends LocalizedStringsMethods {
  buttons: {
    continue: string;
    back: string;
  };
  onboarding: OnboardingSlide[];
}
