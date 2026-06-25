import { Member } from '../types';
import StatusBadge from './StatusBadge';
import { Mail, Phone, Calendar, User, Flame } from 'lucide-react';
import { fellowshipService } from '../services/fellowshipService';

interface MemberTableProps {
  members: Member[];
  onSelectMember: (memberId: string) => void;
}

export default function MemberTable({ members, onSelectMember }: MemberTableProps) {
  if (members.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-dashed border-gray-200 text-center text-gray-500">
        No members found matching the active criteria.
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Card-style List View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {members.map((member) => (
          <div
            key={member.id}
            onClick={() => onSelectMember(member.id)}
            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs hover:border-blue-400 transition-all cursor-pointer space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900 text-base">{member.fullName}</h4>
                <p className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap">
                  <span>{member.department} • {member.level}</span>
                  <span className="inline-flex items-center gap-0.5 text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                    <Flame className="w-3 h-3 text-indigo-500 fill-indigo-500 animate-none shrink-0" />
                    <span>{fellowshipService.getConnectedBrethren(member.churchId || 'futamap', member.id).length} Conn</span>
                  </span>
                </p>
              </div>
              <StatusBadge status={member.status} />
            </div>

            <div className="space-y-1.5 pt-2 border-t border-gray-50 text-xs text-gray-600">
              <div className="flex items-center">
                <Phone className="w-3.5 h-3.5 mr-2 text-gray-400" />
                {member.phoneNumber}
              </div>
              {member.email && (
                <div className="flex items-center">
                  <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  {member.email}
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
                Joined {member.dateJoined}
              </div>
            </div>
            
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-gray-400">MAP:</span>
              <span className="font-medium text-gray-700 bg-gray-50 px-2.5 py-0.5 rounded-md">{member.mapName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-2xl border border-gray-100 shadow-xs">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/75">
            <tr>
              <th scope="col" className="px-6 py-4.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                Name & MAP
              </th>
              <th scope="col" className="px-6 py-4.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                Contact details
              </th>
              <th scope="col" className="px-6 py-4.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                Program & Level
              </th>
              <th scope="col" className="px-6 py-4.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                Birthday
              </th>
              <th scope="col" className="px-6 py-4.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 font-sans">
                Status
              </th>
              <th scope="col" className="relative px-6 py-4.5">
                <span className="sr-only">View Profile</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {members.map((member) => (
              <tr 
                key={member.id}
                onClick={() => onSelectMember(member.id)}
                className="hover:bg-blue-50/20 transition-colors cursor-pointer group"
              >
                <td className="whitespace-nowrap px-6 py-4.5">
                  <div className="flex items-center">
                    <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0 uppercase">
                      {member.fullName.charAt(0)}{member.fullName.split(' ')[1]?.charAt(0) || ''}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-650 transition-colors flex items-center gap-1.5">
                        <span>{member.fullName}</span>
                        <span className="inline-flex items-center gap-0.5 text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold" title="Active connections count">
                          <Flame className="w-2.5 h-2.5 text-indigo-505 fill-indigo-500 shrink-0 animate-pulse" />
                          <span>{fellowshipService.getConnectedBrethren(member.churchId || 'futamap', member.id).length}</span>
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        {member.mapName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4.5">
                  <div className="text-sm text-gray-900 font-medium">{member.phoneNumber}</div>
                  <div className="text-xs text-gray-400">{member.email || "No email"}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4.5">
                  <div className="text-sm text-gray-900 font-medium">{member.department}</div>
                  <div className="text-xs text-gray-400">{member.level}</div>
                </td>
                <td className="whitespace-nowrap px-6 py-4.5 text-sm text-gray-500 font-medium">
                  {new Date(member.birthday).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </td>
                <td className="whitespace-nowrap px-6 py-4.5">
                  <StatusBadge status={member.status} />
                </td>
                <td className="whitespace-nowrap px-6 py-4.5 text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-800 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-all">
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
