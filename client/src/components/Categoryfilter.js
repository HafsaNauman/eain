export default function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-full ${
            selected === cat
              ? "bg-teal-500 text-white"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
