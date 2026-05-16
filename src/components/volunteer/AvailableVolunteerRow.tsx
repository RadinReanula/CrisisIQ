import type { Volunteer, VolunteerSkill } from '../../types';
import { getAvatarStyle, getInitials } from './coordinatorUtils';

interface AvailableVolunteerRowProps {
  volunteer: Volunteer;
  isSelected: boolean;
  onSelect: (volunteerId: string) => void;
}

function formatSkill(skill: VolunteerSkill): string {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}

function PhoneIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.352.47-.89.72-1.465.586a12.036 12.036 0 0 1-7.143-7.143c-.134-.575.116-1.113.586-1.465l1.293-.97c.363-.271.527-.733.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}

export function AvailableVolunteerRow({
  volunteer,
  isSelected,
  onSelect,
}: AvailableVolunteerRowProps) {
  const isAvailable = volunteer.available;

  return (
    <button
      type="button"
      onClick={() => onSelect(volunteer.id)}
      className={`mb-2 flex w-full items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/50 p-3 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
        isSelected
          ? 'scale-[1.01] border-cyan-500/70 bg-cyan-500/10'
          : 'hover:border-slate-600 hover:bg-slate-700/50'
      }`}
      aria-pressed={isSelected}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${getAvatarStyle(volunteer.name)}`}
        aria-hidden
      >
        {getInitials(volunteer.name)}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-medium text-white">{volunteer.name}</p>
        <div className="mt-1.5 flex flex-wrap gap-1">
          {volunteer.skills.length === 0 ? (
            <span className="text-xs text-slate-500">No skills listed</span>
          ) : (
            volunteer.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300"
              >
                {formatSkill(skill)}
              </span>
            ))
          )}
        </div>
        {volunteer.phone && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <PhoneIcon />
            <a
              href={`tel:${volunteer.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-cyan-400"
            >
              {volunteer.phone}
            </a>
          </p>
        )}
      </div>

      <span
        className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${
          isAvailable
            ? 'border-green-500/40 bg-green-900/40 text-green-400'
            : 'border-slate-600 bg-slate-700 text-slate-400'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isAvailable ? 'animate-pulse bg-green-400' : 'bg-slate-500'
          }`}
          aria-hidden
        />
        {isAvailable ? 'Available' : 'Standby'}
      </span>
    </button>
  );
}
