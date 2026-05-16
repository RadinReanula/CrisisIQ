import type { Volunteer, VolunteerSkill } from '../../types';

interface AvailableVolunteerRowProps {
  volunteer: Volunteer;
  isSelected: boolean;
  onSelect: (volunteerId: string) => void;
}

function formatSkill(skill: VolunteerSkill): string {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

export function AvailableVolunteerRow({
  volunteer,
  isSelected,
  onSelect,
}: AvailableVolunteerRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(volunteer.id)}
      className={`w-full rounded-lg border bg-white px-4 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500'
          : 'border-slate-200 hover:border-slate-300'
      }`}
      aria-pressed={isSelected}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-slate-900">{volunteer.name}</p>
        {volunteer.phone && (
          <a
            href={`tel:${volunteer.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-blue-600 hover:underline"
          >
            {volunteer.phone}
          </a>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {volunteer.skills.length === 0 ? (
          <span className="text-xs text-slate-500">No skills listed</span>
        ) : (
          volunteer.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {formatSkill(skill)}
            </span>
          ))
        )}
      </div>
    </button>
  );
}
