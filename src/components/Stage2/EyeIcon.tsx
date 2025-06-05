import Image from 'next/image';
import eye from '@/public/assets/eye.png';

const EyeIcon: React.FunctionComponent = () => {
  return (
    <Image src={eye} alt="Shown"></Image>
  );
}

export default EyeIcon;