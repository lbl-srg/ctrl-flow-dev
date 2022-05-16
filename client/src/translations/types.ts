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
  terms: {
    schedule: string;
    results: string;
    configure: string;
    systems: string;
  };
  onboarding: OnboardingSlide[];
}
