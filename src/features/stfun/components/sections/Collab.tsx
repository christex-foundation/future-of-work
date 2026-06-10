import PrimaryButton from '../common/PrimaryButton';

export default function Collab() {
  return (
    <div className="collab-container relative right-1/2 left-1/2 z-1 col-span-5 -mt-[70px] -mb-[50px] flex h-fit w-screen -translate-x-1/2 flex-col justify-center bg-[#0e1512] align-middle md:-mt-[250px] md:-mb-[20px] md:h-fit md:rounded-[64px] lg:-mb-[30px]">
      <div className="collab-overlay absolute hidden h-full w-full md:block" />
      <img
        src="/collab-dawn.svg"
        loading="lazy"
        alt=""
        className="collab-image h-[690px] w-full object-cover md:rounded-[64px] lg:h-fit"
      />

      <div className="history-stuff absolute flex h-[669px] w-full flex-col items-center md:h-full md:justify-center">
        <p className="collab-history font-serif mt-[145px] h-auto w-[260px] text-[24px] md:mt-[80px] md:w-[380px] md:text-[32px]">
          Take a step into the future
        </p>
        <div className="button mt-[50px]">
          <PrimaryButton
            className="bg-white"
            href="mailto:support@superteam.fun?subject=Working%20with%20Superteam&body=Hello,%20I%20wanted%20to%20explore%20the%20possibility%20of%20us%20working%20together."
            target="_blank"
            rel="noopener noreferrer"
          >
            Collab with us
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
