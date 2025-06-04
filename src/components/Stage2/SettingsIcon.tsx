import Image from 'next/image';
import settingsGear from '@/public/assets/settings-gear.png';

const SettingsIcon: React.FunctionComponent = () => {
  return (
    <Image src={settingsGear} alt="Settings cog"></Image>
  );
}

export default SettingsIcon;