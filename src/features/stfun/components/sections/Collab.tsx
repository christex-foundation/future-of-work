import PrimaryButton from '../common/PrimaryButton';

export default function Collab() {
  return (
    <div className="collab-container relative right-1/2 left-1/2 z-1 col-span-5 -mt-5 flex h-fit w-screen -translate-x-1/2 flex-col justify-center bg-[#0e1512]">
      <div className="collab-overlay absolute hidden h-full w-full md:block" />
      <img
        src="/collab-dawn.svg"
        loading="lazy"
        alt=""
        className="collab-image h-[690px] w-full object-cover lg:h-fit"
      />

      <div className="history-stuff absolute flex h-[669px] w-full flex-col items-center md:h-full md:justify-center">
        <p className="collab-history font-serif mt-[145px] h-auto w-[260px] text-[24px] md:mt-[80px] md:w-[380px] md:text-[32px]">
          Take a step into the future
        </p>
        <div className="button mt-[50px]">
          <PrimaryButton className="bg-white" href="/earn">
            Start Earning
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
