"use client";

import { TrendingUp, Thermometer, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TempReading {
  id: string;
  recordedAt: string;
  grateTemp: number;
  meatTemp: number;
  probeName?: string;
}

interface SessionTempChartProps {
  temps: TempReading[];
  className?: string;
}

export function SessionTempChart({ temps, className }: SessionTempChartProps) {
  if (temps.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ember" />
            Temperatuur Verloop
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-smoke">
            <Thermometer className="h-12 w-12 mx-auto mb-4 text-ash" />
            <p>Nog geen temperatuurmetingen</p>
            <p className="text-sm mt-1">Start een sessie om temperatuurdata te verzamelen</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Simple chart implementation (stub)
  const latestTemp = temps[temps.length - 1];
  const maxGrateTemp = Math.max(...temps.map(t => t.grateTemp));
  const maxMeatTemp = Math.max(...temps.map(t => t.meatTemp));
  
  const sessionDuration = temps.length > 1 
    ? Math.round((new Date(temps[temps.length - 1].recordedAt).getTime() - new Date(temps[0].recordedAt).getTime()) / (1000 * 60))
    : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-ember" />
          Temperatuur Verloop
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current readings */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center p-4 bg-coals rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Thermometer className="h-4 w-4 text-ember" />
              <span className="text-sm text-smoke">Rostemperatuur</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {latestTemp.grateTemp}°C
            </div>
          </div>
          
          <div className="text-center p-4 bg-coals rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Thermometer className="h-4 w-4 text-green-500" />
              <span className="text-sm text-smoke">Kerntemperatuur</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {latestTemp.meatTemp}°C
            </div>
          </div>
        </div>

        {/* Simple chart placeholder */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-smoke">
            <span>Rostemperatuur</span>
            <span>Max: {maxGrateTemp}°C</span>
          </div>
          
          <div className="h-32 bg-coals rounded-lg p-4 flex items-end gap-1">
            {temps.slice(-20).map((temp) => (
              <div
                key={temp.id}
                className="flex-1 bg-ember rounded-t"
                style={{
                  height: `${(temp.grateTemp / maxGrateTemp) * 100}%`,
                  minHeight: "2px",
                }}
                title={`${temp.grateTemp}°C`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-smoke">
            <span>Kerntemperatuur</span>
            <span>Max: {maxMeatTemp}°C</span>
          </div>
          
          <div className="h-32 bg-coals rounded-lg p-4 flex items-end gap-1">
            {temps.slice(-20).map((temp) => (
              <div
                key={temp.id}
                className="flex-1 bg-green-500 rounded-t"
                style={{
                  height: `${(temp.meatTemp / maxMeatTemp) * 100}%`,
                  minHeight: "2px",
                }}
                title={`${temp.meatTemp}°C`}
              />
            ))}
          </div>
        </div>

        {/* Session info */}
        <div className="flex items-center justify-between text-sm text-smoke mt-4 pt-4 border-t border-ash">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{temps.length} metingen</span>
          </div>
          
          {sessionDuration > 0 && (
            <span>{sessionDuration} min sessie</span>
          )}
        </div>

        {/* TODO: Implement proper chart with recharts or similar */}
        <div className="mt-4 p-3 bg-ash/20 rounded-lg text-center text-sm text-smoke">
          <p>📊 Interactieve grafiek komt binnenkort</p>
          <p className="text-xs mt-1">Met recharts voor betere visualisatie</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for session cards
export function TempSummary({ temps }: { temps: TempReading[] }) {
  if (temps.length === 0) {
    return (
      <div className="flex items-center gap-2 text-smoke text-sm">
        <Thermometer className="h-4 w-4" />
        <span>Geen metingen</span>
      </div>
    );
  }

  const latest = temps[temps.length - 1];
  
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <Thermometer className="h-4 w-4 text-ember" />
        <span className="text-smoke">Rost:</span>
        <span className="font-medium">{latest.grateTemp}°C</span>
      </div>
      
      <div className="flex items-center gap-1">
        <Thermometer className="h-4 w-4 text-green-500" />
        <span className="text-smoke">Kern:</span>
        <span className="font-medium">{latest.meatTemp}°C</span>
      </div>
    </div>
  );
}
