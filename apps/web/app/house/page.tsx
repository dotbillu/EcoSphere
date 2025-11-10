import Feedbox from "@components/HouseComponents/feedbox";
import ProfilePage from "@components/profilePage";

export default function House() {
  return (
    <>
      <div className="z-[999] relative ">
        <ProfilePage />
      </div>
      <div className="w-full bg-black">
        <Feedbox />
      </div>
    </>
  );
}
