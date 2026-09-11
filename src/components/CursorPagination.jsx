import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

function CursorPagination({
  hasMore,
  currentPage,
  onPreviousPage,
  onNextPage,
  itemCount,
  itemLabel = 'item',
  itemLabelPlural = 'items',
  showPageNumber = true,
}) {
  const isFirst = currentPage <= 1;
  const isLast = !hasMore;

  return (
    <div className="mt-8 space-y-4 relative z-10">
      {/* Item count */}
      <div className="text-center">
        <p className="text-sm text-gray-700">
          Showing <span className="font-medium">{itemCount}</span>{' '}
          {itemCount === 1 ? itemLabel : itemLabelPlural}
          {hasMore && <span className="text-emerald-600 font-medium"> · More available</span>}
        </p>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Previous Button */}
        <button
          type="button"
          onClick={onPreviousPage}
          disabled={isFirst}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isFirst
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
              : 'bg-white text-gray-700 hover:bg-emerald-600 hover:text-white cursor-pointer shadow-md active:scale-95'
          }`}
        >
          <FaChevronLeft />
          <span>Previous</span>
        </button>

        {/* Page indicator */}
        {showPageNumber && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold border border-emerald-100 shadow-inner">
            {currentPage}
          </div>
        )}

        {/* Next Button */}
        <button
          type="button"
          onClick={onNextPage}
          disabled={isLast}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            isLast
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
              : 'bg-white text-gray-700 hover:bg-emerald-600 hover:text-white cursor-pointer shadow-md active:scale-95'
          }`}
        >
          <span>Next</span>
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
}

export default CursorPagination;
