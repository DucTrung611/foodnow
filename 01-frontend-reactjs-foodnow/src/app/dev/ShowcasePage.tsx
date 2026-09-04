import { ColorTypeSection } from './sections/ColorTypeSection';
import { ButtonSection } from './sections/ButtonSection';
import { FormSection } from './sections/FormSection';
import { BadgeSection } from './sections/BadgeSection';
import { CardSection } from './sections/CardSection';
import { FeedbackSection } from './sections/FeedbackSection';
import { OverlaySection } from './sections/OverlaySection';

/**
 * Dev-only review surface for Gate 2 (design tokens + shared primitives) —
 * not linked from any nav, not a feature. Delete or gate behind an env flag
 * once the design system has shipped past review.
 */
export function ShowcasePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-10">
      <header>
        <p className="text-body-sm text-muted">FoodNow — Design system</p>
        <h1 className="font-display text-display-lg text-ink">Showcase các thành phần dùng chung</h1>
      </header>

      <ColorTypeSection />
      <ButtonSection />
      <FormSection />
      <BadgeSection />
      <CardSection />
      <FeedbackSection />
      <OverlaySection />
    </div>
  );
}
