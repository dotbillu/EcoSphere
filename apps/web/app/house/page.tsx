import Feedbox from "../Components/HouseComponents/feedbox";
import ProfilePage from "../Components/profilePage";

export default function House(){
return(<>
    <div className="z-[999] relative ">
      <ProfilePage/>
</div>
<div>
      <Feedbox/>
    </div>
  </>)
}

