package lockfiles

import (
	"encoding/json"
	"sort"
	"strings"

	"github.com/sourcegraph/sourcegraph/internal/conf/reposource"
)

type Edge struct {
	Source, Target reposource.VersionedPackage
}

func newDependencyGraph() *DependencyGraph {
	return &DependencyGraph{
		dependencies: make(map[reposource.VersionedPackage][]reposource.VersionedPackage),
		edges:        map[Edge]struct{}{},
	}
}

type DependencyGraph struct {
	dependencies map[reposource.VersionedPackage][]reposource.VersionedPackage
	edges        map[Edge]struct{}
}

func (dg *DependencyGraph) addPackage(pkg reposource.VersionedPackage) {
	if _, ok := dg.dependencies[pkg]; !ok {
		dg.dependencies[pkg] = []reposource.VersionedPackage{}
	}
}
func (dg *DependencyGraph) addDependency(a, b reposource.VersionedPackage) {
	dg.dependencies[a] = append(dg.dependencies[a], b)
	dg.edges[Edge{a, b}] = struct{}{}
}

func (dg *DependencyGraph) Roots() (roots []reposource.VersionedPackage, undeterminable bool) {
	set := make(map[reposource.VersionedPackage]struct{}, len(dg.dependencies))
	for pkg := range dg.dependencies {
		set[pkg] = struct{}{}
	}

	for edge := range dg.edges {
		delete(set, edge.Target)
	}

	roots = make([]reposource.VersionedPackage, 0, len(set))
	for k := range set {
		roots = append(roots, k)
	}

	if len(roots) == 0 {
		// If we don't have roots (because of circular dependencies), we use
		// every package as a root.
		// Ideally we'd use other information (such as the data in
		// `package.json` files) to find out what the direct dependencies are.
		for pkg := range dg.dependencies {
			roots = append(roots, pkg)
		}
		return roots, true
	}

	return roots, false
}

func (dg *DependencyGraph) AllEdges() (edges []Edge) {
	edges = make([]Edge, 0, len(dg.edges))
	for edge := range dg.edges {
		edges = append(edges, edge)
	}
	return edges
}

type pkgSet = map[reposource.VersionedPackage]struct{}

func (dg *DependencyGraph) String() string {
	var out strings.Builder

	json.NewEncoder(&out).Encode(dg.AsMap())

	return out.String()
}

func (dg *DependencyGraph) AsMap() map[string]interface{} {
	roots, _ := dg.Roots()

	sort.Slice(roots, func(i, j int) bool { return roots[i].Less(roots[j]) })

	type item struct {
		pkg reposource.VersionedPackage
		out map[string]interface{}
	}

	queue := make([]item, len(roots))

	out := make(map[string]interface{}, len(roots))
	for i, root := range roots {
		queue[i] = item{pkg: root, out: out}
	}

	visited := pkgSet{}
	for len(queue) != 0 {
		var current item
		current, queue = queue[0], queue[1:]

		subOut := map[string]interface{}{}
		// Write current item to its out map
		current.out[current.pkg.VersionedPackageSyntax()] = subOut

		_, alreadyVisited := visited[current.pkg]
		visited[current.pkg] = struct{}{}

		deps, ok := dg.dependencies[current.pkg]
		if !ok || len(deps) == 0 || (alreadyVisited) {
			continue
		}

		sortedDeps := deps
		sort.Slice(sortedDeps, func(i, j int) bool { return sortedDeps[i].Less(sortedDeps[j]) })

		for _, dep := range sortedDeps {
			queue = append(queue, item{pkg: dep, out: subOut})
		}
	}

	return out
}

func printDependenciesToMap(out map[string]interface{}, graph *DependencyGraph, visited pkgSet, node reposource.VersionedPackage) {
	_, alreadyVisited := visited[node]
	visited[node] = struct{}{}

	key := node.VersionedPackageSyntax()
	val := map[string]interface{}{}
	out[key] = val

	deps, ok := graph.dependencies[node]
	if !ok || len(deps) == 0 || (alreadyVisited) {
		return
	}

	sortedDeps := deps
	sort.Slice(sortedDeps, func(i, j int) bool { return sortedDeps[i].Less(sortedDeps[j]) })

	for _, dep := range sortedDeps {
		printDependenciesToMap(val, graph, visited, dep)
	}
}
