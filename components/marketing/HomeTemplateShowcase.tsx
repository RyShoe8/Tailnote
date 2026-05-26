import { HomeTemplatesShowcasePanel } from '@/components/marketing/HomeTemplatesShowcasePanel';
import { sortPresetsForHomeShowcase } from '@/lib/marketing/homeTemplateShowcaseOrder';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

type Props = {
  presets: CatalogPresetRow[];
};

export function HomeTemplateShowcase({ presets }: Props) {
  const ordered = sortPresetsForHomeShowcase(presets);
  if (ordered.length === 0) return null;

  return (
    <section className="container py-16 sm:py-20 lg:pt-24 lg:pb-8">
      <HomeTemplatesShowcasePanel presets={ordered} />
    </section>
  );
}
