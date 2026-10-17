type ProjectTreeNode = {
  id: string;
  title: string;
  url?: string;
  children?: ProjectTreeNode[];
};

function ProjectBranches({ nodes }: { nodes: ProjectTreeNode[] }) {
  return (
    <ul className="project-tree__branches">
      {nodes.map((node) => (
        <li key={node.id} className="project-tree__entry">
          {node.url ? (
            <a
              className="project-tree__link"
              href={node.url}
              target="_blank"
              rel="noreferrer"
            >
              <span>{node.title}</span>
            </a>
          ) : (
            <span className="project-tree__folder">{node.title}/</span>
          )}
          {!!node.children?.length && <ProjectBranches nodes={node.children} />}
        </li>
      ))}
    </ul>
  );
}

export function ProjectTree({ nodes }: { nodes: ProjectTreeNode[] }) {
  return (
    <nav className="project-tree" aria-label="Project websites">
      <p className="project-tree__root">projects/</p>
      <ProjectBranches nodes={nodes} />
    </nav>
  );
}
