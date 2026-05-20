import { Routes } from '@angular/router';

export const routes: Routes = [
	{
		path: '',
		loadComponent: () => import('./pages/home/home').then((component) => component.HomeComponent),
		title: 'AI Resume Analyzer',
	},
	{
		path: '**',
		redirectTo: '',
	},
];
