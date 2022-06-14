	executionStore := &batchSpecWorkspaceExecutionWorkerStore{Store: workStore, observationContext: &observation.TestContext, accessTokenDeleterForTX: func(tx *Store) accessTokenHardDeleter { return tx.DatabaseDB().AccessTokens().HardDeleteByID }}
		ok, err := executionStore.MarkComplete(context.Background(), int(job.ID), opts)
			t.Fatalf("MarkComplete failed. ok=%t, err=%s", ok, err)
		assertJobState(t, btypes.BatchSpecWorkspaceExecutionJobStateCompleted)
		specs, _, err := s.ListChangesetSpecs(ctx, ListChangesetSpecsOpts{BatchSpecID: batchSpec.ID})
		if err != nil {
			t.Fatalf("failed to load changeset specs: %s", err)
		}
		if have, want := len(specs), 1; have != want {
			t.Fatalf("invalid number of changeset specs created: have=%d want=%d", have, want)
		}
		changesetSpecIDs := make([]int64, 0, len(specs))
		for _, reloadedSpec := range specs {
			changesetSpecIDs = append(changesetSpecIDs, reloadedSpec.ID)
			if reloadedSpec.BatchSpecID != batchSpec.ID {
				t.Fatalf("reloaded changeset spec does not have correct batch spec id: %d", reloadedSpec.BatchSpecID)
			}
		}

		if diff := cmp.Diff(changesetSpecIDs, reloadedWorkspace.ChangesetSpecIDs); diff != "" {
		ok, err := executionStore.MarkComplete(context.Background(), int(job.ID), opts)
			t.Fatalf("MarkComplete failed. ok=%t, err=%s", ok, err)
		assertJobState(t, btypes.BatchSpecWorkspaceExecutionJobStateCompleted)
		ok, err := executionStore.MarkComplete(context.Background(), int(job.ID), opts)
			t.Fatalf("MarkComplete failed. ok=%t, err=%s", ok, err)