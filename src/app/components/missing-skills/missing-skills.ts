import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SkillGap } from '../../interfaces/resume-analysis';

@Component({
  selector: 'app-missing-skills',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule, MatIconModule, MatTooltipModule],
  templateUrl: './missing-skills.html',
  styleUrl: './missing-skills.scss',
  host: {
    class: 'app-missing-skills',
  },
})
export class MissingSkillsComponent {
  readonly missingSkills = input<SkillGap[]>([]);

  protected getSeverityColor(severity: string): 'primary' | 'accent' | 'warn' {
    switch (severity) {
      case 'critical':
        return 'warn';
      case 'high':
        return 'warn';
      case 'medium':
        return 'primary';
      case 'low':
        return 'accent';
      default:
        return 'primary';
    }
  }

  protected getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'priority_high';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'done';
      default:
        return 'info';
    }
  }

  protected getCategoryIcon(category: string): string {
    switch (category) {
      case 'technical':
        return 'code';
      case 'tool':
        return 'build';
      case 'certification':
        return 'verified_user';
      case 'keyword':
        return 'label';
      default:
        return 'info';
    }
  }

  protected getSkillsByCategory(category: 'technical' | 'tool' | 'certification' | 'keyword'): SkillGap[] {
    return this.missingSkills().filter((skill) => skill.category === category);
  }

  protected getCategories(): ('technical' | 'tool' | 'certification' | 'keyword')[] {
    const categories = new Set<'technical' | 'tool' | 'certification' | 'keyword'>();
    this.missingSkills().forEach((skill) => categories.add(skill.category));
    return Array.from(categories);
  }
}
