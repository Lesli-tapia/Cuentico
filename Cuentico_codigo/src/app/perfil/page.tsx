import { RequireProfile, Shell } from '@/components/ui';
import ProfileView from '@/modules/profiles/profile-view';

export default function ProfilePage() {
  return <RequireProfile><Shell><ProfileView /></Shell></RequireProfile>;
}
