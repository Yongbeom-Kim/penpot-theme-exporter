import { getColorCssName, getColorValue, getTypographyCssName, getFontFamilyCssVariableName } from "./utils";
import { CSSClass, CSSDeclaration, CSSDeclarationBlock, CSSVariable, EmptyCSSDeclaration, PureCSSGeneratorOptions, OutputFile, RootCSSDeclarationBlock } from "../types/generator";
import { Color, Typography } from "../types/penpot";

export const pureCssGenerator = (theme: { typographies: Typography[], colors: Color[] }, options: PureCSSGeneratorOptions): OutputFile[] => {
  const { typographies, colors } = theme;
  const files: OutputFile[] = [];
  const typographyBlocks = generateCssTypography(typographies, options);
  const colorBlocks = generateCssColors(colors);

  const mergedBlocks = CSSDeclarationBlock.merge(...colorBlocks, ...typographyBlocks);

  files.push({
    path: options?.cssOutputPath ?? "styles.css",
    contents: mergedBlocks.map(block => block.toString()).join("\n\n")
  });

  return files;
};


const generateCssTypography = (typographies: Typography[], options: PureCSSGeneratorOptions): CSSDeclarationBlock[] => {
  const uniqueFontFamilies = [...new Set(typographies.map((typography) => typography.fontFamily))];

  const cssBlocks: CSSDeclarationBlock[] = [];

  const fontFamilyCssVariables: Record<string, CSSVariable> = {};

  uniqueFontFamilies.forEach((fontFamily) => {
    const cssVariableName = getFontFamilyCssVariableName(fontFamily);
    if (options.typography.fallbackToSansSerif) {
      fontFamilyCssVariables[fontFamily] = new CSSVariable(cssVariableName, `"${fontFamily}", sans-serif`);
    } else {
      fontFamilyCssVariables[fontFamily] = new CSSVariable(cssVariableName, `"${fontFamily}"`);
    }
  });

  cssBlocks.push(new RootCSSDeclarationBlock([
    new EmptyCSSDeclaration("Add your own fallback fonts here:"),
    ...Object.values(fontFamilyCssVariables),
  ]));

  for (const typography of typographies) {
    const className = `text-${getTypographyCssName(typography.path ?? "", typography.name)}`;
    
    cssBlocks.push(new CSSClass(className, [
      new CSSDeclaration("font-family", `var(${fontFamilyCssVariables[typography.fontFamily]!.name})`),
      new CSSDeclaration("font-size", `${parseFloat((typography.fontSize / 16).toFixed(4))}rem`),
      new CSSDeclaration("font-style", typography.fontStyle),
      new CSSDeclaration("font-weight", typography.fontWeight),
      new CSSDeclaration("line-height", typography.lineHeight.toString()),
      new CSSDeclaration("letter-spacing", `${parseFloat((typography.letterSpacing / typography.fontSize).toFixed(4))}em`),
      new CSSDeclaration("text-transform", typography.textTransform)
    ]));
  }

  return cssBlocks;
}

const generateCssColors = (colors: Color[]): CSSDeclarationBlock[] => {
  const cssBlocks: CSSDeclarationBlock[] = [];

  cssBlocks.push(new RootCSSDeclarationBlock(
    colors.map((color) => {
      const cssVariableName = getColorCssName(color);
      const colorValue = getColorValue(color);
      return new CSSVariable(cssVariableName, colorValue);
    })
  ));

  return cssBlocks;
}