import { Observable } from "../classes";
import { useObserve } from "../hooks";
import { ObservableType, ObserverCallback } from "../types";
import { setObservableValue } from "../utils/setObservableValue";


export type Translation<T, K extends string> = {
  [key in K]: T | (() => Promise<{ default: T }>) | (() => Promise<T>);
};
export interface TranslationItem<T, K extends string> {
  translation: Translation<T, K>;
  observable: ObservableType<T>;
}

export class I18n<K extends string> extends Observable<K> {
  private translations = new Array<TranslationItem<any, K>>();
  private _currentLanguage: K | undefined;
  private isUsingSystemLanguage = true;

  constructor(initialLanguage?: string | null, initialObservers?: ObserverCallback<K>[]) {
    super(initialObservers);
    if (initialLanguage) {
      this._currentLanguage = initialLanguage as K;
      this.isUsingSystemLanguage = false;
    }

    window.addEventListener("languagechange", () => {
      if (!this.isUsingSystemLanguage)
        this.setLanguage(navigator.language as K);
    });
  }

  get currentLanguage(): K | undefined {
    return this._currentLanguage;
  }
  set currentLanguage(newLang: K | undefined) {
    this.setLanguage(newLang);
    this.isUsingSystemLanguage = false;
  }

  async createTranslation<T>(translation: Translation<T, K>): Promise<ObservableType<T>> {
    const currentTranslation = await this.getCurrentTranslation(translation);
    const observable = useObserve<T>(currentTranslation);
    const translationItem: TranslationItem<T, K> = {
      translation,
      observable,
    };
    this.translations.push(translationItem);
    return observable;
  }

  private getCurrentTranslation<T>(
    translation
      : Translation<T, K>): Promise<T> {
    return new Promise<T>((resolve) => {
      const translationKeys = Object.keys(translation) as K[];
      let key: K | undefined = this.currentLanguage
        ? translationKeys.find((key) => key === this.currentLanguage)
        : undefined;
      if (!key) {
        // It does not have the current language - Fallback to next language in navigator.languages
        key = navigator.languages.find((key) =>
          translationKeys.includes(key as K),
        ) as K;
        if (!key) {
          // Does not include any browser language - I use the latest language of the object
          key = translationKeys[translationKeys.length - 1];
        }
      }
      const value = translation[key];
      this._currentLanguage = key;

      if (typeof value === "function")
        value().then((res) => {
          resolve(res.default ?? res)
        });
      else resolve(value as T);
    })
  }

  private async setLanguage(newLang: K | undefined) {
    if (this._currentLanguage !== newLang) {
      this._currentLanguage = newLang;
      //Update every translation
      await Promise.all(this.translations.map(async (x) => {
        const currentTranslation = await this.getCurrentTranslation(x.translation)
        setObservableValue(x.observable, currentTranslation)
      }));
      // Then notify
      this.notify(newLang);
    }
  }

  useSystemLanguage() {
    this.setLanguage(navigator.language as K);
    this.isUsingSystemLanguage = true;
  }
}
