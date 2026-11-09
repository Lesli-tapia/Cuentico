import { RequireProfile, Shell } from '@/components/ui';
import CollectionView from '@/modules/profiles/collection-view';

export default function CollectionPage() {
  return <RequireProfile><Shell back="/perfil"><CollectionView /></Shell></RequireProfile>;
}
