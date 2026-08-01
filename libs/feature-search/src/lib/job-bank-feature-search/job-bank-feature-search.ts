import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JOB_BANK_API_CLIENT, JobPosting } from 'job-bank-data-access';

@Component({
  selector: 'lib-job-bank-feature-search',
  imports: [CommonModule],
  templateUrl: './job-bank-feature-search.html',
  styleUrl: './job-bank-feature-search.css',
})
export class JobBankFeatureSearch implements OnInit {
  private readonly apiClient = inject(JOB_BANK_API_CLIENT);

  protected readonly postings = signal<JobPosting[]>([]);
  protected readonly loadError = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      this.postings.set(await this.apiClient.getPostings());
    } catch (err) {
      console.error('Failed to load job postings', err);
      this.loadError.set(true);
    }
  }
}
