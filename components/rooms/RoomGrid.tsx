"use client";

import { useState } from "react";
import { rooms } from "@/data/rooms";
import { Room } from "@/types";
import { RoomCard } from "./RoomCard";
import { RoomDetailModal } from "./RoomDetailModal";

export function RoomGrid() {
  const [activeModalRoom, setActiveModalRoom] = useState<Room | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            onOpenDetails={(selected) => setActiveModalRoom(selected)}
          />
        ))}
      </div>

      <RoomDetailModal
        room={activeModalRoom}
        onClose={() => setActiveModalRoom(null)}
      />
    </>
  );
}
