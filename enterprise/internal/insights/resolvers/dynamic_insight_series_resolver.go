package resolvers

import (
	"context"
	"time"

	"github.com/sourcegraph/sourcegraph/enterprise/internal/insights/store"

	"github.com/sourcegraph/sourcegraph/cmd/frontend/graphqlbackend"
	"github.com/sourcegraph/sourcegraph/enterprise/internal/insights/query"
)

var _ graphqlbackend.InsightSeriesResolver = &dynamicInsightSeriesResolver{}
var _ graphqlbackend.InsightStatusResolver = &emptyInsightStatusResolver{}

// dynamicInsightSeriesResolver is a series resolver that expands based on matches from a search query.
type dynamicInsightSeriesResolver struct {
	generated *query.GeneratedTimeSeries
}

func (d *dynamicInsightSeriesResolver) SeriesId() string {
	return d.generated.SeriesId
}

func (d *dynamicInsightSeriesResolver) Label() string {
	return d.generated.Label
}

func (d *dynamicInsightSeriesResolver) Points(ctx context.Context, args *graphqlbackend.InsightsPointsArgs) ([]graphqlbackend.InsightsDataPointResolver, error) {
	var resolvers []graphqlbackend.InsightsDataPointResolver
	for _, point := range d.generated.Points {
		resolvers = append(resolvers, &insightsDataPointResolver{store.SeriesPoint{
			SeriesID: d.generated.SeriesId,
			Time:     point.Time,
			Value:    float64(point.Count),
		}})
	}
	return resolvers, nil
}

func (d *dynamicInsightSeriesResolver) Status(ctx context.Context) (graphqlbackend.InsightStatusResolver, error) {
	return &emptyInsightStatusResolver{}, nil
}

func (d *dynamicInsightSeriesResolver) DirtyMetadata(ctx context.Context) ([]graphqlbackend.InsightDirtyQueryResolver, error) {
	return nil, nil
}

type emptyInsightStatusResolver struct{}

func (e emptyInsightStatusResolver) TotalPoints() int32 {
	return 0
}

func (e emptyInsightStatusResolver) PendingJobs() int32 {
	return 0
}

func (e emptyInsightStatusResolver) CompletedJobs() int32 {
	return 0
}

func (e emptyInsightStatusResolver) FailedJobs() int32 {
	return 0
}

func (e emptyInsightStatusResolver) BackfillQueuedAt() *graphqlbackend.DateTime {
	current := time.Now().AddDate(-1, 0, 0)
	return graphqlbackend.DateTimeOrNil(&current)
}

// gaugeInsightSeriesResolver is a series resolver that expands based on matches from a search query.
type gaugeInsightSeriesResolver struct {
	generated []query.GaugeDataPoint
	seriesId  string
	label     string
}

func (d *gaugeInsightSeriesResolver) SeriesId() string {
	return d.seriesId
}

func (d *gaugeInsightSeriesResolver) Label() string {
	return d.label
}

func (d *gaugeInsightSeriesResolver) Points(ctx context.Context, args *graphqlbackend.InsightsPointsArgs) ([]graphqlbackend.InsightsDataPointResolver, error) {
	var resolvers []graphqlbackend.InsightsDataPointResolver
	// for _, point := range d.generated.Points {
	// 	resolvers = append(resolvers, &insightsDataPointResolver{store.SeriesPoint{
	// 		SeriesID: d.generated.SeriesId,
	// 		Time:     point.Time,
	// 		Value:    float64(point.Count),
	// 	}})
	// }

	for _, point := range d.generated {
		resolvers = append(resolvers, &insightsDataPointResolver{store.SeriesPoint{
			SeriesID: d.seriesId,
			Time:     point.Time,
			Value:    point.Value,
		}})
	}
	return resolvers, nil
}

func (d *gaugeInsightSeriesResolver) Status(ctx context.Context) (graphqlbackend.InsightStatusResolver, error) {
	return &emptyInsightStatusResolver{}, nil
}

func (d *gaugeInsightSeriesResolver) DirtyMetadata(ctx context.Context) ([]graphqlbackend.InsightDirtyQueryResolver, error) {
	return nil, nil
}
