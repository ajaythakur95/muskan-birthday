import { motion } from "framer-motion";
import { Pencil } from "lucide-react";
import type { Photo } from "../../types/photo";
import { cardImage } from "../../utils/imageUrl";

interface PolaroidCardProps {
  photo: Photo;
  index: number;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
}

const TILTS = [-2.4, 1.8, -1.2, 2.6, -2, 1.1];

/** A Polaroid showing the anime illustration with its matching original photo taped on the corner. */
export default function PolaroidCard({ photo, index, canManage, onOpen, onEdit }: PolaroidCardProps) {
  const tilt = TILTS[index % TILTS.length];
  const title = `Memory ${String(photo.n).padStart(2, "0")}`;

  return (
    <motion.article
      className="group relative"
      initial={{ opacity: 0, y: 40, rotate: tilt * 2 }}
      animate={{ opacity: 1, y: 0, rotate: tilt }}
      transition={{ duration: 0.8, delay: Math.min(index, 8) * 0.09, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ rotate: 0, y: -8, scale: 1.02 }}
    >
      <div className="rounded-[0.35rem] bg-[#fffdf8] p-3 pb-4 shadow-[0_18px_40px_-14px_rgba(59,36,102,0.55)]">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[0.2rem] bg-lavender/50">
          <button type="button" onClick={onOpen} aria-label={`Open ${title} in the viewer`} className="absolute inset-0 block size-full cursor-pointer">
            <img
              src={cardImage(photo.anime.url)}
              alt={`Anime illustration for ${title}`}
              loading="lazy"
              decoding="async"
              className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <span className="absolute bottom-2 right-2 w-[34%] rotate-[4deg] overflow-hidden rounded-[0.15rem] border-[3px] border-white shadow-lg">
              <img src={cardImage(photo.original.url)} alt={`Original photo for ${title}`} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover" />
            </span>
          </button>
        </div>
        <div className="px-1 pt-3 text-plum">
          {photo.caption && <p className="line-clamp-2 font-display text-[0.95rem] italic leading-snug text-plum/80">{photo.caption}</p>}
        </div>
      </div>

      {canManage && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit message for ${title}`}
          className="glass absolute -left-2 -top-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-plum"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
      )}
    </motion.article>
  );
}
