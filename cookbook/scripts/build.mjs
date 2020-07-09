// @ts-check
import fse from "fs-extra";
import marked from "marked";
import { join } from "path";
import CONFIG from "../config.mjs";

async function buildLanguageFile(lang, config, isDefault = false) {
  const outFile = join(
    config.outDir,
    isDefault ? "index.html" : `${lang}.html`
  );

  const template = await fse.readFile(config.template, "utf-8");
  const withStandardReplacements = Object.entries(
    config.replacementsPerLanguage[lang]
  ).reduce(
    (orig, [placeholder, replacement]) =>
      orig.replace(placeholder, replacement),
    template
  );
  const withStandardAndMarkdownReplacements = await Object.entries(
    config.markdownFilesReplacementsPerLanguage[lang]
  ).reduce(async (orig, [placeholder, mdFile]) => {
    const mdContents = await fse.readFile(mdFile, "utf-8");
    const replacement = marked(mdContents); // todo: setup code highlighting
    return (await orig).replace(placeholder, replacement);
  }, Promise.resolve(withStandardReplacements));

  await fse.writeFile(outFile, withStandardAndMarkdownReplacements, {
    encoding: "utf-8",
  });
}

export async function build(config) {
  await fse.remove(config.outDir);
  await fse.mkdirp(config.outDir);
  await fse.copy(config.copyToOutDir, config.outDir);
  await Promise.all(
    config.languages.map((lang) =>
      buildLanguageFile(lang, config, lang === config.defaultLanguage)
    )
  );
}

build(CONFIG).catch(e => {
  console.error(e.stack);
  process.exit(1);
});
