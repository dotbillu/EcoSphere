import Feedbox from "@housecomponents/feedbox";
import ProfilePage from "@shared/profilePage";

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
