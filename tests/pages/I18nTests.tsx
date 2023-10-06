import type { TypedEvent } from "@michijs/htmltype";
import { createCustomElement, I18n, Title, useStorage } from "../../src";
import en from "./i18nTests/en.json";

type SupportedLanguages = "es" | "en";

const supportedLanguages: Record<SupportedLanguages, string> = {
  en: 'English',
  es: 'Español'
}

const languageStorage = useStorage({
  lang: 'en' as SupportedLanguages
})

const translator = new I18n<SupportedLanguages>(languageStorage.lang);

const t = await translator.createTranslation({
  es: () => import("./i18nTests/es.json"),
  en,
});

const I18nTests = createCustomElement("i18n-tests", {
  methods: {
    onChangeLanguage(ev: TypedEvent<HTMLSelectElement>) {
      if (ev.target)
        languageStorage.lang = ev.target.value as SupportedLanguages
    },
  },
  render() {
    return (
      <>
        <Title>I18n tests Page</Title>
        <span>{t.language}</span>
        <select onchange={this.onChangeLanguage}>
          {Object.entries(supportedLanguages).map(([key, label]) => (
            <option
              selected={key === translator.currentLanguage}
              value={key}
            >
              {label}
            </option>
          ))}
        </select>
        <span>{t.dogBit}</span>
      </>
    );
  },
});

export default I18nTests