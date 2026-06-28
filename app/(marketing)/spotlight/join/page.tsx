import { redirect } from 'next/navigation';

export default function SpotlightJoinPage() {
  // Seamlessly route the user into the signup flow which will redirect them to the spotlight apply flow after creation
  redirect('/signup?redirect=/dashboard/spotlight/apply');
}
