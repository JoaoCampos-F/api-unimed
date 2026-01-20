/**
 * Remove acentos e caracteres especiais de uma string
 * Converte para uppercase
 */
export function removerAcentos(texto: string): string {
  if (!texto) return '';

  const acentos: Record<string, string> = {
    À: 'A',
    Á: 'A',
    Â: 'A',
    Ã: 'A',
    Ä: 'A',
    Å: 'A',
    Æ: 'A',
    Ç: 'C',
    È: 'E',
    É: 'E',
    Ê: 'E',
    Ë: 'E',
    Ì: 'I',
    Í: 'I',
    Î: 'I',
    Ï: 'I',
    Ð: 'D',
    Ñ: 'N',
    Ò: 'O',
    Ó: 'O',
    Ô: 'O',
    Õ: 'O',
    Ö: 'O',
    Ø: 'O',
    Ù: 'U',
    Ú: 'U',
    Û: 'U',
    Ü: 'U',
    Ý: 'Y',
    Ŕ: 'R',
    Þ: 's',
    ß: 'B',
    à: 'a',
    á: 'a',
    â: 'a',
    ã: 'a',
    ä: 'a',
    å: 'a',
    æ: 'a',
    ç: 'c',
    è: 'e',
    é: 'e',
    ê: 'e',
    ë: 'e',
    ì: 'i',
    í: 'i',
    î: 'i',
    ï: 'i',
    ð: 'o',
    ñ: 'n',
    ò: 'o',
    ó: 'o',
    ô: 'o',
    õ: 'o',
    ö: 'o',
    ø: 'o',
    ù: 'u',
    ú: 'u',
    û: 'u',
    ý: 'y',
    þ: 'b',
    ÿ: 'y',
    ŕ: 'r',
    "'": '',
  };

  let textoSemAcentos = texto;
  for (const [acento, substituto] of Object.entries(acentos)) {
    textoSemAcentos = textoSemAcentos.replace(
      new RegExp(acento, 'g'),
      substituto,
    );
  }

  return textoSemAcentos.toUpperCase();
}
