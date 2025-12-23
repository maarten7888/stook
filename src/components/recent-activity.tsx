import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Thermometer, ArrowRight, Clock } from "lucide-react";

interface Activity {
  type: 'recipe' | 'session';
  id: string;
  title: string;
  date: string;
  link: string;
  icon: typeof BookOpen | typeof Thermometer;
}

interface RecentActivityProps {
  activities: Activity[];
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Zojuist';
  if (diffMins < 60) return `${diffMins} min geleden`;
  if (diffHours < 24) return `${diffHours} uur geleden`;
  if (diffDays < 7) return `${diffDays} dag${diffDays > 1 ? 'en' : ''} geleden`;
  
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <Card className="bg-coals border-ash">
        <CardHeader>
          <CardTitle className="text-lg font-heading text-ash flex items-center gap-2">
            <Clock className="h-5 w-5 text-ember" />
            Recente Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-smoke">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-ember/50" />
            <p className="text-sm">Nog geen activiteit</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-coals border-ash">
      <CardHeader>
        <CardTitle className="text-lg font-heading text-ash flex items-center gap-2">
          <Clock className="h-5 w-5 text-ember" />
          Recente Activiteit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activities.slice(0, 5).map((activity) => {
          const Icon = activity.icon;
          const date = new Date(activity.date);
          const timeAgo = getTimeAgo(date);

          return (
            <Link
              key={`${activity.type}-${activity.id}`}
              href={activity.link}
              className="block p-2 rounded-lg hover:bg-charcoal/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'recipe' ? 'bg-ember/20' : 'bg-blue-500/20'
                }`}>
                  <Icon className={`h-4 w-4 ${
                    activity.type === 'recipe' ? 'text-ember' : 'text-blue-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ash group-hover:text-ember transition-colors truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-smoke">{timeAgo}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-smoke group-hover:text-ember transition-colors flex-shrink-0" />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

