// components/EditProfileModal.tsx
"use client";

import { useState, useRef, ChangeEvent } from "react";
// Assuming Profile.tsx is in the parent folder, adjusted path
import { UserProfile } from "../app/profile/[username]/page";
import { User, userAtom } from "../store"; // Import from your store
import { useAtom } from "jotai";
import Image from "next/image";
// Removed 'Calendar' import
import { X, Camera, Loader2, Mail, User as UserIcon } from "lucide-react";

interface EditProfileModalProps {
  profile: UserProfile;
  onClose: () => void;
  // Callback to update the parent profile page and global state
  onUpdate: (updatedUser: UserProfile) => void;
}

export default function EditProfileModal({
  profile,
  onClose,
  onUpdate,
}: EditProfileModalProps) {
  const [, setUserAtom] = useAtom(userAtom); // To update global state
  const [name, setName] = useState(profile.name);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Handle both local and external Google URLs for preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile.image
      ? profile.image.startsWith("http")
        ? profile.image
        : `http://localhost:4000/uploads/${profile.image}`
      : null
  );
  
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("username", profile.username);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const res = await fetch(
        `http://localhost:4000/userProfile/${profile.username}`,
        {
          method: "PATCH",
          body: formData,
        },
      );

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await res.json();
      
      const updatedProfileState = {
        ...profile, // Keep existing posts, etc.
        ...updatedUser, // Overwrite with new name, image, etc.
      };

      // Update global atom state
      setUserAtom(updatedUser as User);

      // Update parent component state
      onUpdate(updatedProfileState);

      onClose(); // Close modal on success
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if save button should be enabled
  const isSaveDisabled = isLoading || (name === profile.name && !imageFile);

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal "Island" */}
      <div
        className="relative w-full max-w-[600px] rounded-2xl bg-black border border-zinc-700 text-white shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing on modal click
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-300 hover:bg-zinc-800"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold">Edit Profile</h2>
          </div>
          
          {/* Save Button (now in header) */}
          <button
            type="submit"
            form="edit-profile-form" // Points to the form ID
            disabled={isSaveDisabled}
            className="flex items-center justify-center px-4 py-1.5 rounded-full bg-white text-black text-sm font-bold transition-colors disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Save"
            )}
          </button>
        </div>

        {/* Form content now scrolls if it gets too tall */}
        <div className="max-h-[80vh] overflow-y-auto">
          {/* Placeholder Banner */}
          <div className="h-40 bg-zinc-800" />
          
          {/* Form */}
          {/* Reduced vertical space with space-y-4 and padding p-4 */}
          <form id="edit-profile-form" onSubmit={handleSubmit} className="pb-6 space-y-4">
            
            {/* Profile Picture Upload (overlaps banner) */}
            <div className="px-4 -mt-14">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                // Reduced size to w-28 h-28
                className="relative w-28 h-28 rounded-full group"
              >
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Profile preview"
                    fill
                    style={{ objectFit: "cover" }}
                    // Added border
                    className="rounded-full border-4 border-black"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-zinc-700 flex items-center justify-center text-4xl border-4 border-black">
                    {name[0]}
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={28} />
                </div>
              </button>
            </div>

            {/* Fields container */}
            <div className="px-4 space-y-4">
              {/* Editable Field: Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-400 mb-1"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  // Updated style to be cleaner
                  className="w-full px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Disabled Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">
                    Username
                  </label>
                  {/* Removed icon and pl-10 */}
                  <input
                    type="text"
                    value={profile.username}
                    disabled
                    className="w-full px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-500 mb-1">
                    Email
                  </label>
                  {/* Removed icon and pl-10 */}
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed"
                  />
                </div>
                
                {/* --- REMOVED "JOINED" DATE FIELD --- */}

              </div>
            </div>
            
            {/* Removed the old Save Button div */}
            
          </form>
        </div>
      </div>
    </div>
  );
}
