/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GraphEdge } from './GraphEdge';
import { GraphVertex } from './GraphVertex';

export class Graph {
  /**
   *
   *
   * @param isDirected
   */
  constructor(isDirected = false) {
    this.vertices = {};
    this.edges = {};
    this.isDirected = isDirected;
  }

  public vertices: { [key: string]: GraphVertex };

  public edges: { [key: string]: GraphEdge };

  public isDirected: boolean;

  /**
   *
   *
   * @param newVertex
   * @returns
   */
  public addVertex(newVertex: GraphVertex): Graph {
    this.vertices[newVertex.getKey()] = newVertex;

    return this;
  }

  /**
   *
   *
   * @param vertexKey
   * @returns GraphVertex
   */
  public getVertexByKey(vertexKey: string): GraphVertex {
    return this.vertices[vertexKey];
  }

  /**
   *
   *
   * @param vertex
   * @returns
   */
  public getNeighbors(vertex: GraphVertex) {
    return vertex.getNeighbors();
  }

  /**
   *
   *
   * @return
   */
  public getAllVertices(): GraphVertex[] {
    return Object.values(this.vertices);
  }

  /**
   *
   *
   * @return
   */
  public getAllEdges(): GraphEdge[] {
    return Object.values(this.edges);
  }

  /**
   *
   *
   * @param edge
   * @returns
   */
  public addEdge(edge: GraphEdge) {
    // Try to find and end start vertices.
    let startVertex = this.getVertexByKey(edge.startVertex.getKey());
    let endVertex = this.getVertexByKey(edge.endVertex.getKey());

    // Insert start vertex if it wasn't inserted.
    if (!startVertex) {
      this.addVertex(edge.startVertex);
      startVertex = this.getVertexByKey(edge.startVertex.getKey());
    }

    // Insert end vertex if it wasn't inserted.
    if (!endVertex) {
      this.addVertex(edge.endVertex);
      endVertex = this.getVertexByKey(edge.endVertex.getKey());
    }

    // Check if edge has been already added.
    if (this.edges[edge.getKey()]) {
      throw new Error('Edge has already been added before');
    } else {
      this.edges[edge.getKey()] = edge;
    }

    // Add edge to the vertices.
    if (this.isDirected) {
      // If graph IS directed then add the edge only to start vertex.
      startVertex.addEdge(edge);
    } else {
      // If graph ISN'T directed then add the edge to both vertices.
      startVertex.addEdge(edge);
      endVertex.addEdge(edge);
    }

    return this;
  }

  /**
   *
   *
   * @param edge
   */
  public deleteEdge(edge: GraphEdge) {
    // Delete edge from the list of edges.
    if (this.edges[edge.getKey()]) {
      delete this.edges[edge.getKey()];
    } else {
      throw new Error('Edge not found in graph');
    }

    // Try to find and end start vertices and delete edge from them.
    const startVertex = this.getVertexByKey(edge.startVertex.getKey());
    const endVertex = this.getVertexByKey(edge.endVertex.getKey());

    startVertex.deleteEdge(edge);
    endVertex.deleteEdge(edge);
  }

  /**
   *
   *
   * @param startVertex
   * @param endVertex
   * @return
   */
  public findEdge(startVertex: GraphVertex, endVertex: GraphVertex): any {
    const vertex = this.getVertexByKey(startVertex.getKey());

    if (!vertex) {
      return null;
    }

    return vertex.findEdge(endVertex);
  }

  /**
   *
   *
   * @param vertexKey
   * @returns
   */
  public findVertexByKey(vertexKey: string | number) {
    if (this.vertices[vertexKey]) {
      return this.vertices[vertexKey];
    }

    return null;
  }

  /**
   *
   *
   * @return
   */
  public getWeight() {
    return this.getAllEdges().reduce((weight: number, graphEdge: GraphEdge) => {
      return weight + graphEdge.weight;
    }, 0);
  }

  /**
   *
   *
   * Reverse all the edges in directed graph.
   *
   * @return
   */
  public reverse() {
    /** @param {GraphEdge} edge */
    this.getAllEdges().forEach((edge: GraphEdge) => {
      // Delete straight edge from graph and from vertices.
      this.deleteEdge(edge);

      // Reverse the edge.
      edge.reverse();

      // Add reversed edge back to the graph and its vertices.
      this.addEdge(edge);
    });

    return this;
  }

  /**
   *
   *
   * @return
   */
  public getVerticesIndices() {
    const verticesIndices = {} as any;

    this.getAllVertices().forEach((vertex: GraphVertex, index) => {
      const key = vertex.getKey() as any;
      verticesIndices[key] = index;
    });

    return verticesIndices;
  }

  /**
   *
   *
   * @return
   */
  public getAdjacencyMatrix() {
    const vertices = this.getAllVertices();
    const verticesIndices = this.getVerticesIndices() as any;

    // Init matrix with infinities meaning that there is no ways of
    // getting from one vertex to another yet.
    const adjacencyMatrix = Array(vertices.length)
      .fill(null)
      .map(() => {
        return Array(vertices.length).fill(Infinity);
      }) as any;

    // Fill the columns.
    vertices.forEach((vertex: GraphVertex, vertexIndex) => {
      vertex.getNeighbors().forEach((neighbor: any) => {
        const neighborIndex = verticesIndices[neighbor.getKey()];

        adjacencyMatrix[vertexIndex][neighborIndex] = this.findEdge(
          vertex,
          neighbor
        ).weight;
      });
    });

    return adjacencyMatrix;
  }

  /**
   *
   *
   * @return
   */
  public toString() {
    return Object.keys(this.vertices).toString();
  }
}
