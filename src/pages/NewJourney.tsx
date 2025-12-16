import { JourneyCreationWizard } from '@/components/journey/JourneyCreationWizard';
import FlagshipGate from '@/components/FlagshipGate';

export default function NewJourney() {
  return (
    <FlagshipGate featureName="journey creation">
      <JourneyCreationWizard />
    </FlagshipGate>
  );
}
