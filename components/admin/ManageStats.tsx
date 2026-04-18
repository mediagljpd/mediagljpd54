
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { DownloadIcon } from '../Icons';

const ManageStats: React.FC = () => {
    const { bookings } = useContext(AppContext);

    const stats = useMemo(() => {
        const totalClasses = bookings.length;
        const totalStudents = bookings.reduce((sum, b) => sum + (b.studentCount || 0), 0);
        
        const byCommune: Record<string, number> = {};
        const bySchool: Record<string, number> = {};
        const byLevel: Record<string, number> = {};

        bookings.forEach(b => {
            if (b.commune) byCommune[b.commune] = (byCommune[b.commune] || 0) + 1;
            if (b.schoolName) bySchool[b.schoolName] = (bySchool[b.schoolName] || 0) + 1;
            if (b.classLevel) byLevel[b.classLevel] = (byLevel[b.classLevel] || 0) + 1;
        });

        const communeData = Object.entries(byCommune)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const levelData = Object.entries(byLevel)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        return {
            totalClasses,
            totalStudents,
            communeData,
            levelData,
            schoolCount: Object.keys(bySchool).length
        };
    }, [bookings]);

    const handleExportExcel = () => {
        const exportData = bookings.map(b => ({
            'Date': b.date,
            'Heure': `${b.time}h`,
            'Animation': b.animationTitle,
            'Commune': b.commune,
            'École': b.schoolName,
            'Niveau': b.classLevel,
            'Élèves': b.studentCount,
            'Enseignant': b.teacherName,
            'Email': b.email,
            'Téléphone': b.phoneNumber
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Statistiques");
        XLSX.writeFile(wb, `Statistiques_Reservations_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Classes accueillies</span>
                    <span className="text-4xl font-black text-blue-600">{stats.totalClasses}</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Enfants sensibilisés</span>
                    <span className="text-4xl font-black text-green-600">{stats.totalStudents}</span>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Écoles partenaires</span>
                    <span className="text-4xl font-black text-purple-600">{stats.schoolCount}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[450px]">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Top 10 des Communes</h3>
                    <div className="h-80 w-full">
                        {stats.communeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                <BarChart data={stats.communeData} layout="vertical" margin={{ left: 40, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Aucune donnée disponible</div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[450px]">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">Répartition par Niveau</h3>
                    <div className="h-80 w-full">
                        {stats.levelData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                                <PieChart>
                                    <Pie
                                        data={stats.levelData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.levelData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Aucune donnée disponible</div>
                        )}
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 mt-4">
                        {stats.levelData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Detailed Table Section */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Détails des Réservations</h3>
                        <p className="text-xs text-gray-500 mt-1">Liste exhaustive des interventions réalisées</p>
                    </div>
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Exporter Excel
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Commune</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">École</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Niveau</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Élèves</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Animation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {bookings.length > 0 ? (
                                [...bookings].sort((a, b) => b.date.localeCompare(a.date)).map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-700">{b.date}</td>
                                        <td className="px-6 py-4 text-xs text-gray-600">{b.commune}</td>
                                        <td className="px-6 py-4 text-xs text-gray-600">{b.schoolName}</td>
                                        <td className="px-6 py-4 text-xs font-black text-blue-600">{b.classLevel}</td>
                                        <td className="px-6 py-4 text-xs text-center font-bold text-gray-700">{b.studentCount}</td>
                                        <td className="px-6 py-4 text-xs text-gray-500 italic">{b.animationTitle}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic text-sm">Aucune réservation enregistrée</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageStats;
