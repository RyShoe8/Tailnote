type Props = {
  html?: string;
  imageSrc?: string;
  alt?: string;
  className?: string;
};

/** Marketing preview: static screenshot or live HTML fallback. */
export function MarketingSignaturePreview({ html, imageSrc, alt, className }: Props) {
  if (imageSrc) {
    return (
      <div className={className ?? 'min-w-0 rounded-md bg-muted/20 p-1'}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={alt ?? 'Email signature example'}
          className="block h-auto w-full"
          loading="lazy"
          decoding="async"
        />
      </div>
    );
  }

  if (!html) return null;

  return (
    <div
      className={
        className ??
        'signature-email-preview rounded-md border bg-white p-3 text-left'
      }
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
