
"use client"

import React, { useRef } from 'react'
import type { AppControls } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2, UploadCloud } from 'lucide-react'
import { Slider } from '../ui/slider'

interface SidebarControlsProps {
  controls: AppControls
  setControls: React.Dispatch<React.SetStateAction<AppControls>>
  onImageUpload: (file: File) => void
  onAnalyze: () => void
  isLoading: boolean
}

export function SidebarControls({
  controls,
  setControls,
  onImageUpload,
  onAnalyze,
isLoading,
}: SidebarControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      onImageUpload(file)
    }
  }

  const handleInputChange = (
    key: keyof AppControls,
    value: string | number | boolean
  ) => {
    setControls(prev => ({ ...prev, [key]: value }))
  }

  const controlItems: {
    key: keyof AppControls;
    label: string;
    type: 'slider' | 'input';
    unit: string;
    min: number;
    max: number;
    step: number;
  }[] = [
    { key: 'avgWeightG', label: 'Avg Fruit Weight', type: 'slider', unit: 'g', min: 50, max: 150, step: 1 },
    { key: 'postHarvestLossPct', label: 'Post-harvest Loss', type: 'slider', unit: '%', min: 0, max: 30, step: 1 },
    { key: 'numPlants', label: 'Number of Plants', type: 'input', unit: '', min: 1, max: 1000, step: 1 },
    { key: 'forecastDays', label: 'Forecast Horizon', type: 'input', unit: 'days', min: 1, max: 30, step: 1 },
    { key: 'harvestCapacityKgDay', label: 'Harvest Capacity', type: 'input', unit: 'kg/day', min: 1, max: 500, step: 5 },
    { key: 'gddBaseC', label: 'GDD Base', type: 'input', unit: '°C', min: 5, max: 15, step: 1 },
  ]
  
  return (
    <div className="flex h-full flex-col gap-4 p-2">
      <Button onClick={() => fileInputRef.current?.click()} variant="outline">
        <UploadCloud className="mr-2 h-4 w-4" />
        Upload Image
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg"
      />

      <Separator />

      <div className="flex flex-col gap-4 overflow-y-auto pr-2">
        {controlItems.map(item => (
          <div key={item.key} className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor={item.key}>{item.label}</Label>
              <span className="text-xs text-muted-foreground">{controls[item.key]} {item.unit}</span>
            </div>
            {item.type === 'slider' ? (
               <Slider
                 id={item.key}
                 min={item.min}
                 max={item.max}
                 step={item.step}
                 value={[Number(controls[item.key])]}
                 onValueChange={(value) => handleInputChange(item.key, value[0])}
               />
            ) : (
              <Input
                id={item.key}
                type="number"
                value={String(controls[item.key])}
                onChange={e => handleInputChange(item.key, e.target.valueAsNumber)}
                min={item.min}
                max={item.max}
                step={item.step}
              />
            )}
          </div>
        ))}
        
        <Separator />

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="district">District</Label>
                <Input
                    id="district"
                    value={controls.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className="w-2/3"
                />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="use-detection-model">Use Detection Model</Label>
                <Switch id="use-detection-model" checked={controls.useDetectionModel} onCheckedChange={(val) => handleInputChange('useDetectionModel', val)} />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="use-live-weather">Use Live Weather</Label>
                <Switch id="use-live-weather" checked={controls.useLiveWeather} onCheckedChange={(val) => handleInputChange('useLiveWeather', val)} />
            </div>
        </div>

      </div>

      <div className="mt-auto">
        <Button onClick={onAnalyze} className="w-full" disabled={isLoading}>
          {isLoading ? <Loader2 className="animate-spin" /> : 'Analyze & Forecast'}
        </Button>
      </div>
    </div>
  )
}
