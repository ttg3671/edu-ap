import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaEdit, FaTrash, FaGripVertical } from 'react-icons/fa';

function SortableRow({ row, rowIndex, columns, onEdit, onDelete, id }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef} 
      style={style} 
      className={`hover:bg-gray-50 transition-colors ${isDragging ? 'shadow-lg bg-white' : ''}`}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 w-10">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded"
        >
          <FaGripVertical />
        </button>
      </td>
      {columns.map((column, colIndex) => (
        <td
          key={colIndex}
          className={`px-6 py-4 whitespace-nowrap text-sm ${
            column.bold ? 'font-medium' : ''
          } text-gray-900`}
        >
          {column.render
            ? column.render(row[column.accessor], row, rowIndex)
            : row[column.accessor] || '-'}
        </td>
      ))}
      {(onEdit || onDelete) && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          {onEdit && (
            <button
              onClick={() => onEdit(row)}
              className="text-emerald-600 hover:text-emerald-900 mr-4 inline-flex items-center gap-1 cursor-pointer"
            >
              <FaEdit />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(row)}
              className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <FaTrash />
              <span>Delete</span>
            </button>
          )}
        </td>
      )}
    </tr>
  );
}

function SortableDataTable({ columns, data, onEdit, onDelete, loading, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event) {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = data.findIndex((item) => item.id === active.id);
      const newIndex = data.findIndex((item) => item.id === over.id);
      
      const newData = arrayMove(data, oldIndex, newIndex);
      onReorder(newData, active.id, oldIndex, newIndex);
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-3 text-${column.align || 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}
                  >
                    {column.header}
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 min-h-[200px]">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    <p className="text-gray-500 mt-2">Loading data...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-gray-500">
                    No data found. Add your first entry!
                  </td>
                </tr>
              ) : (
                <SortableContext
                  items={data.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {data.map((row, rowIndex) => (
                    <SortableRow
                      key={row.id}
                      id={row.id}
                      row={row}
                      rowIndex={rowIndex}
                      columns={columns}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </SortableContext>
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      {!loading && data.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{data.length}</span> {data.length === 1 ? 'entry' : 'entries'}
          </p>
        </div>
      )}
    </div>
  );
}

export default SortableDataTable;
