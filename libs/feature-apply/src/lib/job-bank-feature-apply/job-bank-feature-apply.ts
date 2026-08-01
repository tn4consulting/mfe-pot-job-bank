import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JOB_BANK_API_CLIENT, JobApplication, JobPosting } from 'job-bank-data-access';
import { getStoredSession } from '@tn4consulting/shared-auth';

@Component({
  selector: 'lib-job-bank-feature-apply',
  imports: [CommonModule, FormsModule],
  templateUrl: './job-bank-feature-apply.html',
  styleUrl: './job-bank-feature-apply.css',
})
export class JobBankFeatureApply implements OnInit {
  private readonly apiClient = inject(JOB_BANK_API_CLIENT);

  protected readonly postings = signal<JobPosting[]>([]);
  protected readonly loadError = signal(false);
  protected readonly submitting = signal(false);
  protected readonly confirmation = signal<JobApplication | null>(null);
  protected selectedJobId = '';

  async ngOnInit(): Promise<void> {
    try {
      const postings = await this.apiClient.getPostings();
      this.postings.set(postings);
      this.selectedJobId = postings[0]?.id ?? '';
    } catch (err) {
      console.error('Failed to load job postings', err);
      this.loadError.set(true);
    }
  }

  async submit(): Promise<void> {
    const session = getStoredSession();
    if (!session || !this.selectedJobId) {
      return;
    }
    this.submitting.set(true);
    try {
      this.confirmation.set(await this.apiClient.apply(this.selectedJobId, session.sub));
    } catch (err) {
      console.error('Failed to submit job application', err);
      this.loadError.set(true);
    } finally {
      this.submitting.set(false);
    }
  }
}
