import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { JobBankFeatureSearch } from 'job-bank-feature-search';
import { JobBankFeatureApply } from 'job-bank-feature-apply';
import { TranslocoPipe } from '@tn4consulting/shared-i18n';
import { CLAIM_JOB_BANK, getStoredSession, hasClaim, onSessionChange } from '@tn4consulting/shared-auth';

@Component({
  imports: [JobBankFeatureSearch, JobBankFeatureApply, RouterModule, TranslocoPipe],
  selector: 'msca-jb-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'job-bank';
  // Defense in depth: this app validates its own claim independently,
  // never assuming "the shell let me navigate here, so I'm authorized" --
  // see CLAUDE.md's "Security: defense in depth" section.
  protected readonly hasAccess = signal(hasClaim(getStoredSession(), CLAIM_JOB_BANK));

  constructor() {
    const unsubscribe = onSessionChange((session) =>
      this.hasAccess.set(hasClaim(session, CLAIM_JOB_BANK)),
    );
    inject(DestroyRef).onDestroy(unsubscribe);
  }
}
