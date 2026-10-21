import { useState } from 'react';
import { DocumentTextLinearIcon, GalleryLinearIcon, FileLinearIcon } from '@solar-icons/react';

export interface Attachment { filename: string; url: string }
export type AttachmentKind = 'image' | 'pdf' | 'other';

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i;

export function kindOf(a: Attachment): AttachmentKind {
  if (IMAGE_EXT.test(a.filename)) return 'image';
  if (/\.pdf$/i.test(a.filename)) return 'pdf';
  return 'other';
}

// Filnamnen från formuläret är långa slumpade nummer — visa något läsbart i stället.
export function labelFor(a: Attachment, index: number, items: Attachment[]): string {
  const kind = kindOf(a);
  const sameKind = items.filter((x) => kindOf(x) === kind);
  const n = sameKind.indexOf(a) + 1;
  if (kind === 'image') return sameKind.length > 1 ? `Bild ${n}` : 'Bild';
  if (kind === 'pdf') return sameKind.length > 1 ? `PDF ${n}` : 'PDF';
  return a.filename.length > 28 ? a.filename.slice(0, 25) + '…' : a.filename;
}

export const downloadUrl = (url: string) => url + (url.includes('?') ? '&' : '?') + 'download=1';

export function FileIcon({ kind, size = 28 }: { kind: AttachmentKind; size?: number }) {
  if (kind === 'pdf') return <DocumentTextLinearIcon size={size} />;
  if (kind === 'image') return <GalleryLinearIcon size={size} />;
  return <FileLinearIcon size={size} />;
}

// Miniatyrer i ett rutnät. Bilder visas på riktigt; PDF:er och övriga filer som kort. En bild som
// inte går att visa (t.ex. HEIC i Chrome) faller tillbaka till ett kort.
export function Gallery({ items, onOpen }: { items: Attachment[]; onOpen: (index: number) => void }) {
  const [failed, setFailed] = useState<Set<number>>(new Set());
  if (!items.length) return null;

  return (
    <div className="adm-gallery">
      {items.map((a, i) => {
        const kind = kindOf(a);
        const showImage = kind === 'image' && !failed.has(i);
        return (
          <button key={a.url} type="button" className={`adm-thumb${showImage ? '' : ' is-file'}`} onClick={() => onOpen(i)} aria-label={`Öppna ${labelFor(a, i, items)}`}>
            {showImage ? (
              <img src={a.url} alt={labelFor(a, i, items)} loading="lazy" decoding="async" onError={() => setFailed((s) => new Set(s).add(i))} />
            ) : (
              <>
                <FileIcon kind={kind} />
                <span className="adm-thumb-name">{labelFor(a, i, items)}</span>
                <span className="adm-thumb-kind">{kind === 'pdf' ? 'PDF' : 'Fil'}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
