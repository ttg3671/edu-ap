import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaBook, FaVideo, FaPlus, FaDollarSign } from 'react-icons/fa';

function Card({ item, onEdit, onDelete, onViewLessons, onViewSyllabus, onAddVideo, onAddLessons, onAddSyllabus, imageField, titleField, lessonCountField, descriptionField, isActiveField = 'is_active', isFreeField = 'is_free', justUploaded = false }) {
  const imgBaseUrl = import.meta.env.VITE_IMG_URL || '';
  const [isUploadDisabled, setIsUploadDisabled] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const isActive = item[isActiveField] === true || item[isActiveField] === 1 || item[isActiveField] === "1";
  const isFree = item[isFreeField] === true || item[isFreeField] === 1 || item[isFreeField] === "1";

  useEffect(() => {
    // Only disable button if this item was just uploaded
    if (justUploaded) {
      setIsUploadDisabled(true);
      setRemainingTime(30);

      // Countdown timer
      const countdownInterval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Re-enable button after 30 seconds
      const timer = setTimeout(() => {
        setIsUploadDisabled(false);
        setRemainingTime(0);
      }, 30000);

      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    }
  }, [justUploaded]);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
      {/* Image Section */}
      {imageField && item[imageField] && (
        <div className="relative w-full aspect-video bg-gray-200 overflow-hidden">
          <img
            src={
              item[imageField]?.startsWith('http')
                ? item[imageField]
                : `${(imgBaseUrl || '').replace(/\/+$/, '')}${item[imageField]?.startsWith('/') ? item[imageField] : `/${item[imageField]}`}`
            }
            alt={item[titleField] || 'Image'}
            loading="lazy"
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x225?text=No+Image';
            }}
          />
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {/* Title and Status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {titleField && item[titleField] && (
            <h3 className="text-xl font-bold text-gray-900 line-clamp-2 flex-1">
              {item[titleField]}
            </h3>
          )}
          <div className="flex flex-col gap-1 items-end">
            {item[isActiveField] !== undefined && (
              <span className={`px-2 py-1 rounded text-[12px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-sm ${
                isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
              }`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            )}
            {item[isFreeField] !== undefined && (
              <span className={`px-2 py-1 rounded text-[12px] font-extrabold uppercase tracking-wider whitespace-nowrap shadow-sm ${
                isFree ? 'bg-emerald-500 text-white border border-emerald-600' : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}>
                {isFree ? 'FREE' : 'PAID'}
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {descriptionField && item[descriptionField] && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 line-clamp-3">
              {item[descriptionField]}
            </p>
          </div>
        )}

        {/* Lesson Count */}
        {lessonCountField && item[lessonCountField] !== undefined && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{item[lessonCountField]}</span> {item[lessonCountField] === 1 ? 'Lesson' : 'Lessons'}
            </p>
          </div>
        )}

        {/* View Lessons Button */}
        {onViewLessons && (
          <div className="mb-4">
            <button
              onClick={() => onViewLessons(item.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer font-medium"
            >
              <FaBook />
              <span>View Lessons</span>
            </button>
          </div>
        )}

        {/* View Syllabus Button */}
        {onViewSyllabus && (
          <div className="mb-4">
            <button
              onClick={() => onViewSyllabus(item.id)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer font-medium"
            >
              <FaBook />
              <span>View Syllabus</span>
            </button>
          </div>
        )}

        {/* Add/Edit Video and Add Lessons/Syllabus Buttons */}
        {(onAddVideo || onAddLessons || onAddSyllabus) && (
          <div className="flex items-center gap-2 mb-4">
            {onAddVideo && (
              <>
                <button
                  onClick={() => onAddVideo(item.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors cursor-pointer font-medium text-sm"
                >
                  <FaPlus />
                  <span>Add Video</span>
                </button>
                <button
                  onClick={() => onAddVideo(item.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer font-medium text-sm"
                >
                  <FaEdit />
                  <span>Edit Video</span>
                </button>
              </>
            )}
            {onAddLessons && (
              <button
                onClick={() => onAddLessons(item.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer font-medium text-sm"
              >
                <FaPlus />
                <span>Add Lessons</span>
              </button>
            )}
            {onAddSyllabus && (
              <button
                onClick={() => onAddSyllabus(item.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer font-medium text-sm"
              >
                <FaPlus />
                <span>Add Syllabus</span>
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer font-medium"
              >
                <FaEdit />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id, item.title)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer font-medium"
              >
                <FaTrash />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Card;
