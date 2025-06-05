import Image from 'next/image';
import eyeOff from '@/public/assets/eye-off.png';

const EyeOffIcon: React.FunctionComponent = () => {
  return (
    <Image src={eyeOff} alt="Hidden"></Image>
  );
}

export default EyeOffIcon;