// Redimensiona e recomprime uma imagem no navegador antes do upload.
// Usa a Canvas API nativa (sem dependências externas).
//
// - Limita o maior lado a `maxLado` px (mantendo a proporção).
// - Exporta como JPEG com `qualidade` (0..1).
// - Se a compressão não compensar (ficar maior) ou falhar, devolve o original.
// - SVG e GIF são ignorados (vetor/animados não se beneficiam de JPEG).

const TIPOS_IGNORADOS = ['image/svg+xml', 'image/gif'];

const criarBitmap = async (file) => {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return await createImageBitmap(file);
  }
};

export const formatarBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const comprimirImagem = async (file, { maxLado = 1600, qualidade = 0.8 } = {}) => {
  if (!file?.type?.startsWith('image/') || TIPOS_IGNORADOS.includes(file.type)) {
    return file;
  }

  try {
    const bitmap = await criarBitmap(file);
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close?.();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', qualidade),
    );

    // Só usa a versão comprimida se ela realmente for menor.
    if (!blob || blob.size >= file.size) return file;

    const nome = `${file.name.replace(/\.[^.]+$/, '') || 'imagem'}.jpg`;
    return new File([blob], nome, { type: 'image/jpeg' });
  } catch {
    return file;
  }
};
